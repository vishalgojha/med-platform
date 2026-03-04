import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Info, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TestCard({ test, onAddToCart }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col border-2 hover:border-indigo-100 transition-colors overflow-hidden group">
        <div className="h-2 bg-gradient-to-r from-indigo-400 to-purple-400" />
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <Badge variant="secondary" className="mb-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
              {test.category}
            </Badge>
            <span className="font-bold text-lg text-indigo-600">${test.price}</span>
            </div>
            <CardTitle className="text-xl text-slate-800">{test.name}</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-400 flex flex-col gap-1">
            <span>{test.medical_name}</span>
            {test.provider_name && (
              <span className="flex items-center gap-1 text-indigo-500 mt-1">
                 <img src={test.provider_logo || "https://via.placeholder.com/20"} className="w-4 h-4 rounded-full object-cover" alt="" />
                 Provided by {test.provider_name}
              </span>
            )}
            </CardDescription>
            </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-sm text-slate-600 leading-relaxed">
              {test.simple_explanation}
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            Results in: {test.turnaround_time}
          </div>
        </CardContent>
        <CardFooter className="pt-4 border-t border-slate-50 bg-slate-50/50">
          <Button 
            onClick={() => onAddToCart(test)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all group-hover:shadow-lg"
          >
            Add to Cart <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}